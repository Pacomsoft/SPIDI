import { ProblemObject } from "../contracts/problem-object.type";

export class FetchError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
    
    static fromProblemObject(problem: ProblemObject): FetchError {
        let message: string = '';
        if('errors' in problem) {
            const errors = problem.errors;
            if(typeof errors === 'object' && errors !== null) {
                let errorBag: string[] = [];
                Object.keys(errors).forEach(key => {
                    const errorMessages: unknown = errors[key as keyof typeof errors];
                    if(Array.isArray(errorMessages) && errorMessages.every(e => typeof e === 'string')) {
                        errorBag.push(... errorMessages);
                    } else if(typeof errorMessages === 'string') {
                        errorBag.push(errorMessages);
                    }
                });
                errorBag = [...new Set(errorBag)];
                message = errorBag.join("\n");
            }
        } else {
            message = problem.detail || problem.title;
        }
        return new FetchError(message, problem.status);
    }

    static fromErrors(errors: string[] | string, statusCode: number): FetchError {
        if (typeof errors === "string") {
            return new FetchError(errors, statusCode);
        }
        return new FetchError(errors.join("\n"), statusCode);
    }

    static fromStatus(statusCode: number, defaultMessage: string = "An error occurred"): FetchError {
        const message = `Error ${statusCode}: ${defaultMessage}`;
        return new FetchError(message, statusCode);
    }
}